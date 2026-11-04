const ToastNotification = ({ toast }) => {
  const isError = toast.type === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!toast.show}
      className={`fixed bottom-6 right-6 z-[60] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        toast.show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-20 opacity-0"
      } ${
        isError
          ? "border-[#F0C4AE] bg-[#FBEDE4] text-[#8A3B12]"
          : "border-[#14201C] bg-[#14201C] text-white"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${
          isError ? "text-[#B42318]" : "text-[#F2A93B]"
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {isError ? "error" : "check_circle"}
      </span>
      <span className="text-sm font-medium leading-snug">{toast.message}</span>
    </div>
  );
};

export default ToastNotification;
