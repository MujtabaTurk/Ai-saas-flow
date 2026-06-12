import * as Yup from "yup";

export const notificationReadSchema = Yup.object({
  isRead: Yup.boolean().required("Choose whether the notification is read.")
});
