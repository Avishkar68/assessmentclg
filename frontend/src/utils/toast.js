import { toast } from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message);
  },
  error: (error) => {
    let msg = 'An unexpected error occurred';
    if (typeof error === 'string') {
      msg = error;
    } else if (error && error.response && error.response.data && error.response.data.message) {
      msg = error.response.data.message;
    } else if (error && error.message) {
      msg = error.message;
    }
    toast.error(msg);
  },
  info: (message) => {
    toast(message);
  },
};

export default showToast;
