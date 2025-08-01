export const isExtensionError = (error: any): boolean => {
  const message = error?.message || error?.toString() || "";
  const filename = error?.filename || "";

  return (
    message.includes("chrome-extension") ||
    message.includes("moz-extension") ||
    message.includes("LastPass") ||
    message.includes("message channel closed") ||
    message.includes("asynchronous response") ||
    filename.includes("chrome-extension") ||
    filename.includes("moz-extension")
  );
};

export const suppressExtensionErrors = () => {
  // Override console.error to suppress extension errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(" ");
    if (isExtensionError({ message })) {
      return; // Suppress extension errors
    }
    originalError.apply(console, args);
  };
};
