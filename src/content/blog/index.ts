import type { ComponentType } from "react";
import HowToGetPaid from "./how-to-get-paid-on-vest";
import InstantVsEvaluation from "./vest-instant-vs-evaluation";
import PayoutProof from "./vest-payout-proof";
import VsCompetitors from "./vest-vs-competitors";
import { POST_META, type PostMeta } from "./posts";

export type { PostMeta } from "./posts";
export { POST_META as BLOG_POSTS, getPostMeta } from "./posts";

const CONTENT: Record<string, ComponentType> = {
  "how-to-get-paid-on-vest": HowToGetPaid,
  "vest-payout-proof": PayoutProof,
  "vest-vs-competitors": VsCompetitors,
  "vest-instant-vs-evaluation": InstantVsEvaluation,
};

export interface Post extends PostMeta {
  Content: ComponentType;
}

export const POSTS: Post[] = POST_META.map((meta) => ({ ...meta, Content: CONTENT[meta.slug] }));

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug) ?? null;
