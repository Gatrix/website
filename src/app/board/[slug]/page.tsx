import { notFound } from "next/navigation";
import BoardAutoReturn from "@/components/BoardAutoReturn";
import TextBoardPage from "@/components/TextBoardPage";
import {
  falloutCharacterName,
  fetchFalloutText,
  isFalloutSlug,
} from "@/lib/fallout-db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FalloutCharacterBoardPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isFalloutSlug(slug)) notFound();

  const name = falloutCharacterName(slug);
  const text = (await fetchFalloutText(name)) ?? "";

  return (
    <>
      <BoardAutoReturn href="/board" delayMs={10_000} />
      <TextBoardPage>{text || "\u00A0"}</TextBoardPage>
    </>
  );
}
