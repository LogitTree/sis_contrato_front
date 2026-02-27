import { theme } from "./theme";

export const fieldFocusHandlers = {
  onFocus: (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    e.currentTarget.style.borderColor = theme.colors.primary;
    e.currentTarget.style.boxShadow =
      "0 0 0 3px rgba(37, 99, 235, 0.15)";
  },

  onBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    e.currentTarget.style.borderColor = theme.colors.border;
    e.currentTarget.style.boxShadow = "none";
  },
};