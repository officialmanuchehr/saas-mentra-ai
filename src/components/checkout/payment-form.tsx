"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confetti } from "@/components/checkout/confetti";
import { completeCheckout } from "@/app/c/[slug]/actions";

interface PaymentFormProps {
  communityId: string;
  slug: string;
  communityName: string;
  amount: number;
  currency: string;
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function formatCvc(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function PaymentForm({ communityId, slug, communityName, amount, currency }: PaymentFormProps) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [status, setStatus] = useState<"form" | "processing" | "success">("form");

  const isValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvc.length === 3 &&
    cardholderName.trim().length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      toast.error("Заполните все поля карты.");
      return;
    }

    setStatus("processing");
    // Имитация обработки платежа — это макет, реальный эквайринг не подключён.
    await new Promise((r) => setTimeout(r, 1200));

    try {
      await completeCheckout(communityId, slug, { amount, currency });
      setStatus("success");
      setTimeout(() => router.push(`/c/${slug}`), 2200);
    } catch {
      toast.error("Не удалось завершить оплату. Попробуйте снова.");
      setStatus("form");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Confetti />
        <CheckCircle2 className="size-16 text-success" strokeWidth={1.5} />
        <h2 className="text-xl font-extrabold">Оплата прошла успешно!</h2>
        <p className="text-muted-foreground">
          Добро пожаловать в «{communityName}». Переносим вас внутрь...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="cardholderName" className="text-sm font-medium">
          Имя владельца карты
        </label>
        <Input
          id="cardholderName"
          placeholder="IVAN IVANOV"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="cardNumber" className="text-sm font-medium">
          Номер карты
        </label>
        <Input
          id="cardNumber"
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <label htmlFor="expiry" className="text-sm font-medium">
            Срок действия
          </label>
          <Input
            id="expiry"
            placeholder="ММ/ГГ"
            inputMode="numeric"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          />
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor="cvc" className="text-sm font-medium">
            CVC
          </label>
          <Input
            id="cvc"
            placeholder="123"
            inputMode="numeric"
            value={cvc}
            onChange={(e) => setCvc(formatCvc(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
          <ShieldCheck className="size-3.5" /> Защищено банком-партнёром
        </span>
        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
          <Lock className="size-3.5" /> SSL-шифрование 256 бит
        </span>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={status === "processing"}>
        {status === "processing" ? "Обрабатываем платёж..." : `Оплатить ${amount} ${currency}`}
      </Button>
    </form>
  );
}
