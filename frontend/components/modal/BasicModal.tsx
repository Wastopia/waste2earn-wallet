import { Fragment } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface ModalProps {
  open: boolean;
  width?: string;
  height?: string;
  top?: string;
  background?: string;
  padding?: string;
  rounded?: string;
  text?: string;
  border?: string;
  children: any;
  overlayZIndex?: string;
  contentZIndex?: string;
}

const Modal = ({
  open,
  width = "w-[95%] sm:w-[440px] md:w-[540px] lg:w-[640px]",
  height = "",
  top = "top-[50%]",
  text = "text-PrimaryTextColorLight dark:text-PrimaryTextColor",
  background = "bg-PrimaryColorLight dark:bg-PrimaryColor",
  padding = "p-4 sm:p-6",
  rounded = "rounded-lg",
  border = "",
  overlayZIndex = "1000",
  contentZIndex = "2000",
  children,
}: ModalProps) => {
  return (
    <Fragment>
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={`fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow z-[${overlayZIndex}]`}
          />
          <Dialog.Content 
            className={`fixed ${top} left-[50%] outline-none shadow-md z-[${contentZIndex}]`}
          >
            <div
              className={`
                absolute flex flex-col justify-start items-start text-base sm:text-lg
                transform -translate-x-1/2 -translate-y-1/2 
                transition-all duration-300 ease-out
                data-[state=open]:animate-contentShow
                scale-95 hover:scale-100
                max-h-[90vh] overflow-y-auto
                ${width} ${height} ${background} ${padding} ${rounded} ${text} ${border}
              `}
            >
              {children}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Fragment>
  );
};

export default Modal;
