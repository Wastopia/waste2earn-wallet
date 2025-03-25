import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { clsx } from "clsx";

interface IDrawerProps {
  isDrawerOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  enableClose?: boolean;
}

export default function BasicDrawer(props: IDrawerProps) {
  const { isDrawerOpen, onClose, children, title, enableClose = true } = props;
  return (
    <>
      <div className={getDrawerBlank(isDrawerOpen)} />
      <div className={getDrawerContainerStyle(isDrawerOpen)}>
        {title && onClose && (
          <div className="flex items-center justify-between px-4 sm:px-8 mt-6 mb-6">
            <h1 className="text-xl font-bold text-PrimaryTextColorLight dark:text-PrimaryTextColor">{title}</h1>
            <CloseIcon onClick={() => onClose?.()} className={getCloseIconStyles(enableClose)} />
          </div>
        )}
        {isDrawerOpen ? children : null}
      </div>
    </>
  );
}

function getCloseIconStyles(enabled: boolean) {
  return clsx(
    "cursor-pointer",
    enabled
      ? "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor"
      : "stroke-PrimaryTextColorLight/50 dark:stroke-PrimaryTextColor/50 cursor-not-allowed",
  );
}

function getDrawerContainerStyle(isDrawerOpen: boolean) {
  return clsx(
    "fixed",
    "z-[1000]",
    "w-full", // Full width on mobile
    "max-w-[31rem]", // Max width for larger screens
    "h-screen",
    "inset-x-0", // Center horizontally
    "mx-auto", // Center horizontally
    "top-[100px]", // Add 100px top margin
    "bg-PrimaryColorLight",
    "dark:bg-PrimaryColor",
    "transition-all",
    "duration-500",
    "ease-in-out",
    "flex flex-col",
    "rounded-lg",
    isDrawerOpen ? "translate-y-0" : "translate-y-full", // Slide up instead of from left
    "overflow-y-auto", // Allow scrolling
    "max-h-[calc(100vh-100px)]" // Adjust max height to account for top margin
  );
}

function getDrawerBlank(isDrawerOpen: boolean) {
  return clsx(
    "fixed",
    "inset-0", // Cover entire screen
    "z-[999]", // One less than drawer to be behind it
    "bg-black",
    "opacity-60",
    "transition-opacity",
    "duration-500",
    "ease-in-out",
    !isDrawerOpen && "hidden",
  );
}