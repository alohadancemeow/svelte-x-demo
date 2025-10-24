// Format join date
export const formatJoinDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
    }).format(new Date(date));
};

// Get user initials for avatar fallback
export const getUserInitials = (name: string) => {
    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
};