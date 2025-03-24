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
          <div className="flex items-center justify-between px-8 mt-8 mb-8">
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
    "w-[31rem]",
    "h-screen",
    "top-10",
    "bg-PrimaryColorLight",
    "dark:bg-PrimaryColor",
    "transition-left",
    "duration-500",
    "ease-in-out",
    "flex flex-col",
    isDrawerOpen ? "left-0" : "-left-full",
    "rounded-lg"
  );
}

function getDrawerBlank(isDrawerOpen: boolean) {
  return clsx(
    "fixed",
    "top-10",
    "bottom-0",
    "right-0",
    "left-0",
    "z-[1000]",
    "bg-black",
    "opacity-60",
    "transition-opacity",
    "duration-500",
    "ease-in-out",
    !isDrawerOpen && "hidden",
  );
}
