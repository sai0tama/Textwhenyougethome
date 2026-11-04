import { INSTAGRAM_PROFILE } from "@/features/home/data/socialPosts";

/** Registration links live in one place so they can be swapped without touching JSX. */
export const WALK_REGISTRATION_URL =
  "https://urbanaut.app/spot/street-smart-past-curfew?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGntk_Ryf_WKesOYmgz-bgyhgcOSz2OgjMhNou0UhS4xYG1HeYyPwPSwL2tCbo_aem_Ok1JmJKSrHvfKyzoHikPew";

export type PastEvent = {
  id: string;
  title: string;
  caption: string;
  image: string;
  instagramUrl: string;
  whatWeLearned?: string | undefined;
  /** pinned position on the desktop poster wall */
  pos: { left: string; top: string; width: string; rotate: number };
};

export type UpcomingWalk = {
  id: string;
  date: string;
  place: string;
  city: string;
  registrationUrl: string;
};
