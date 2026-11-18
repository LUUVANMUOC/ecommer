# AGENTS.md — Quy tắc làm việc trong repo này

Áp dụng cho mọi agent/phiên làm việc trong `Project_ThuongMaiDienTu`.

## 1. Git: KHÔNG tự commit / push (quy tắc bắt buộc)

- **KHÔNG BAO GIỜ** tự chạy: `git commit`, `git push`, `git add`, `git tag`,
  `git branch`, `git merge`, `git rebase`, `git reset`, `git stash`,
  `git clean`, `git checkout -- .`, `git restore`, `git revert`.
- Mọi thay đổi chỉ được ghi vào **working tree** (sửa/tạo file trên đĩa).
- Chỉ được commit/push khi người dùng nói rõ ràng, ví dụ:
  "commit đi", "commit và push", "tạo commit".
  Khi được phép commit thì:
  - Chỉ `git add` đúng các file thuộc thay đổi vừa làm.
  - **Không** add/commit: `opencode.jsonc`, `backend/.env`, `frontend/.env`,
    `backend/public/uploads/`, `dist/`, `node_modules/`.
  - Báo lại hash commit sau khi xong.
- Được phép dùng lệnh git **chỉ đọc**: `git status`, `git diff`, `git log`,
  `git show`, `git ls-files`, `git rev-parse`.

## 2. File không được tự ý sửa / xoá

- `opencode.jsonc` (cấu hình quyền của người dùng).
- `backend/.env`, `frontend/.env` (chứa secret) — chỉ đọc khi cần kiểm tra.
- Không xoá file/thư mục của người dùng nếu chưa được hỏi.

## 3. Trước khi báo "xong"

- Chạy kiểm tra phù hợp: `node --check` cho backend, `npm run build` cho frontend.
- Liệt kê rõ: file nào đã tạo/sửa, đã test gì, kết quả ra sao.
- Nêu rõ "chưa commit" nếu chưa được phép commit.
