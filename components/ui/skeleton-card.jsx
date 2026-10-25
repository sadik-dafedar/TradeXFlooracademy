import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard({ className }) {
    return (
        <div className={`flex flex-col space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
            <Skeleton className="h-48 w-full rounded-xl bg-white/10" />
            <div className="space-y-2 pt-2">
                <Skeleton className="h-6 w-3/4 rounded-lg bg-white/10" />
                <Skeleton className="h-4 w-full rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-2/3 rounded-lg bg-white/5" />
            </div>
            <div className="pt-4 mt-auto">
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
            </div>
        </div>
    )
}

export function SkeletonStats() {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex justify-center">
                <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            </div>
            <div className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
                <Skeleton className="h-4 w-16 rounded-lg bg-white/5" />
            </div>
        </div>
    )
}
// ... existing components

export function SkeletonReview() {
    return (
        <div className="min-w-[350px] p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full bg-white/10" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded bg-white/10" />
                    <Skeleton className="h-3 w-20 rounded bg-white/5" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded bg-white/5" />
                <Skeleton className="h-3 w-5/6 rounded bg-white/5" />
                <Skeleton className="h-3 w-4/6 rounded bg-white/5" />
            </div>
        </div>
    )
}

export function SkeletonVideo() {
    return (
        <div className="aspect-video rounded-2xl border border-white/10 bg-white/5 relative overflow-hidden">
            <Skeleton className="h-full w-full bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-16 w-16 rounded-full bg-white/10" />
            </div>
        </div>
    )
}

export function SkeletonFeature() {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-40 rounded bg-white/5" />
        </div>
    )
}
