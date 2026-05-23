import Image from "next/image";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";
import { formatCurrency } from "@/lib/utils";
import { Heart, Users } from "lucide-react";

interface CaixinhaCardProps {
  caixinha: {
    slug: string;
    title: string;
    coupleNames: string;
    goalAmount: number;
    raisedAmount: number;
    primaryColor: string;
    coupleImageUrl?: string | null;
    description?: string | null;
    donations?: { id: string }[];
  };
  showLink?: boolean;
}

export function CaixinhaCard({ caixinha, showLink = true }: CaixinhaCardProps) {
  const donorCount = caixinha.donations?.length ?? 0;

  const card = (
    <div
      className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
      style={{ borderTop: `4px solid ${caixinha.primaryColor}` }}
    >
      {/* Header */}
      <div
        className="relative p-6 text-white text-center"
        style={{
          background: "#171728",
        }}
      >
        {/* Couple photo */}
        {caixinha.coupleImageUrl ? (
          <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-white/30">
            <Image
              src={caixinha.coupleImageUrl}
              alt={caixinha.coupleNames}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-white/30"
            style={{ backgroundColor: `${caixinha.primaryColor}30` }}
          >
            <Heart
              className="w-8 h-8"
              style={{ color: caixinha.primaryColor }}
              fill="currentColor"
            />
          </div>
        )}

        <h3 className="font-bold text-xl mb-1">{caixinha.title}</h3>
        <p className="text-sm opacity-80">{caixinha.coupleNames}</p>
      </div>

      {/* Body */}
      <div className="p-5">
        {caixinha.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{caixinha.description}</p>
        )}

        <ProgressBar
          raised={caixinha.raisedAmount}
          goal={caixinha.goalAmount}
          primaryColor={caixinha.primaryColor}
        />

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>{donorCount} doadores</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: caixinha.primaryColor }}>
            {formatCurrency(caixinha.raisedAmount)}
          </div>
        </div>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link href={`/${caixinha.slug}`} className="block card-hover">
        {card}
      </Link>
    );
  }

  return card;
}
