<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
</script>

<div class="p-4 border-b">
    <div class="flex gap-4">
        <Skeleton class="size-12 rounded-full" />
        <div class="flex-1 space-y-2">
            <div class="flex items-center justify-between">
                <div class="space-y-1">
                    <Skeleton class="w-24 h-4" />
                    <Skeleton class="w-16 h-3" />
                </div>
                <Skeleton class="size-8 rounded-md" />
            </div>
            <div class="space-y-2">
                <Skeleton class="w-full h-4" />
                <Skeleton class="w-3/4 h-4" />
            </div>
            <div class="flex items-center gap-4">
                <Skeleton class="w-16 h-8" />
                <Skeleton class="w-16 h-8" />
            </div>
        </div>
    </div>
</div>
