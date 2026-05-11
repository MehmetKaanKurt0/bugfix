"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";

export default function ConnectionBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2
            bg-amber-500/15 border-b border-amber-500/20 py-2 text-amber-400 text-xs"
        >
          <WifiOff className="w-3.5 h-3.5" />
          Bağlantı kesildi
          <Loader2 className="w-3 h-3 animate-spin ml-1" />
          yeniden bağlanılıyor...
        </motion.div>
      )}
    </AnimatePresence>
  );
}
