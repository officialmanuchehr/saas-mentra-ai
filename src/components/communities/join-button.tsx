import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JoinButtonProps {
  slug: string;
  priceMonthly: number | null;
  currency: string;
}

export function JoinButton({ slug, priceMonthly, currency }: JoinButtonProps) {
  return (
    <Button asChild size="lg">
      <Link href={`/c/${slug}/join`}>
        {priceMonthly === null ? "Вступить" : `Вступить за ${priceMonthly} ${currency}/мес`}
      </Link>
    </Button>
  );
}
