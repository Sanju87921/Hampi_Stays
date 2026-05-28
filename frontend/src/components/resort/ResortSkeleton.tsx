import { motion } from "framer-motion";

export function ResortCardSkeleton() {
  return (
    <div className="bg-white  rounded-[2.5rem] border border-sand-100  overflow-hidden shadow-sm flex flex-col">
      <div className="relative h-72 w-full bg-sand-100  overflow-hidden">
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-sand-100  rounded-full" />
          <div className="h-4 w-12 bg-sand-100  rounded-full" />
        </div>
        <div className="h-8 w-3/4 bg-sand-100  rounded-lg" />
        <div className="h-4 w-full bg-sand-100  rounded-md" />
        <div className="h-4 w-2/3 bg-sand-100  rounded-md" />
        <div className="pt-6 flex items-center justify-between border-t border-sand-50">
          <div className="space-y-2">
            <div className="h-6 w-20 bg-sand-100  rounded-md" />
            <div className="h-3 w-16 bg-sand-100  rounded-full" />
          </div>
          <div className="h-12 w-32 bg-sand-100  rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ResortGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ResortCardSkeleton key={i} />
      ))}
    </div>
  );
}
