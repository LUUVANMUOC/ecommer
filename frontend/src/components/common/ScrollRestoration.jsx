// src/components/common/ScrollRestoration.jsx
// Khôi phục vị trí cuộn khi Back/Forward, cuộn lên đầu khi mở trang mới.
// Dùng được với BrowserRouter (không cần Data Router).
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "scroll-positions";
const MAX_ENTRIES = 50;
// Trang tải dữ liệu bất đồng bộ nên thử khôi phục vài lần.
const RESTORE_DELAYS = [0, 80, 200, 400];

const readPositions = () => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writePositions = (positions) => {
  try {
    const entries = Object.entries(positions);
    if (entries.length > MAX_ENTRIES) {
      entries
        .sort((a, b) => (a[1]?.at ?? 0) - (b[1]?.at ?? 0))
        .slice(0, entries.length - MAX_ENTRIES)
        .forEach(([key]) => delete positions[key]);
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // sessionStorage đầy hoặc bị chặn → bỏ qua, không ảnh hưởng điều hướng
  }
};

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(null);

  if (positions.current === null) positions.current = readPositions();

  // Tự quản lý vị trí cuộn, tránh trình duyệt khôi phục chồng lên.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Lưu vị trí cuộn của entry hiện tại (gộp sự kiện trong 120ms).
  useEffect(() => {
    let timer = 0;

    const save = () => {
      positions.current[location.key] = {
        y: window.scrollY,
        url: `${location.pathname}${location.search}`,
        at: Date.now(),
      };
      writePositions(positions.current);
    };

    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        save();
      }, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) window.clearTimeout(timer);
      save();
    };
  }, [location.key, location.pathname, location.search]);

  // POP (Back/Forward) → khôi phục cuộn; PUSH/REPLACE → lên đầu trang.
  useEffect(() => {
    const url = `${location.pathname}${location.search}`;
    const saved =
      navigationType === "POP" ? positions.current[location.key] : null;
    const target = saved && saved.url === url ? saved.y : 0;

    if (target <= 0) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const timers = RESTORE_DELAYS.map((delay) =>
      window.setTimeout(() => window.scrollTo(0, target), delay),
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [location.key, location.pathname, location.search, navigationType]);

  return null;
};

export default ScrollRestoration;
