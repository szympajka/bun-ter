import { ExternalToast, toast as sonnerToast } from "sonner";

const start = +new Date();

const rtf1 = new Intl.RelativeTimeFormat('en', { style: 'long' });

export const toast = (message: string | React.ReactNode, data?: ExternalToast) => {
  if (!data) {
    data = {};
  }

  data.description = (
    <div>
      {data.description}
      <br/>
      <small style={{ opacity: 0.7 }}>
        Dispatched <time>{rtf1.format(+new Date() - start, 'second')}</time> since start
      </small>
    </div>
  )

  sonnerToast(message, data);
}