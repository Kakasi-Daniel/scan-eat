import { UtensilsCrossed, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Welcome</h1>
            <p className="text-zinc-500 mt-2 text-lg">
              Fresh food, easy ordering
            </p>
          </div>
          <div className="border-t border-zinc-200 pt-6">
            <div className="flex items-center justify-center gap-3 text-zinc-600">
              <QrCode className="w-6 h-6" />
              <p className="text-sm">
                Scan the QR code on your table to start ordering
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
