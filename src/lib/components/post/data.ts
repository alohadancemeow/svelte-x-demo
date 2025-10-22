import {
    Globe2Icon,
    LockIcon,
    Users2Icon
} from "@lucide/svelte";

export const privacyOptions = [
    {
        value: "public",
        label: "Public",
        description: "Anyone can see your post",
        icon: Globe2Icon,
    },
    {
        value: "followers",
        label: "Followers",
        description: "Only your followers can see your post",
        icon: Users2Icon,
    },
    {
        value: "private",
        label: "Private",
        description: "Only you can see your post",
        icon: LockIcon,
    },
] as const;

export const feelingOptions = [
    "Happy",
    "Sad",
    "Angry",
    "Surprised",
    "Love",
    "Excited",
    "Stressed",
    "Relaxed",
    "Bored",
    "Busy",
    "Hungry",
    "Thirsty",
    "Sleepy",
    "Sick",
    "Dizzy",
    "Stoned",
    "Drunk",
    "High",
    "Stoned",
] as const;

export type Privacy = (typeof privacyOptions)[number]["value"];
export type Feeling = (typeof feelingOptions)[number];