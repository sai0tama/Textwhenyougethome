import {
  submitNewsletterServerFn,
  type NewsletterResponse,
} from "@/server/functions/submitNewsletter";

export async function subscribeToNewsletter(
  email: string,
  consent: boolean = true,
): Promise<NewsletterResponse> {
  try {
    const res = await submitNewsletterServerFn({
      data: { email, consent },
    });
    return res;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Subscription failed.";
    return {
      success: false,
      status: "error",
      error: errMessage,
    };
  }
}
