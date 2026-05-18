import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import useProjectStore from "@/store/project";

type LogoProps = {
  className?: string;
  imageClassName?: string;
};

export function Logo({ className, imageClassName }: LogoProps) {
  const { setProject } = useProjectStore();

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={cn("w-auto", className)}
    >
      <img
        src="/logo-dark.svg"
        alt="HyperFix"
        className={cn(
          "h-[150px] w-auto translate-y-1 dark:hidden",
          imageClassName,
        )}
      />
      <img
        src="/logo-light.svg"
        alt="HyperFix"
        className={cn(
          "hidden h-[150px] w-auto translate-y-1 dark:block",
          imageClassName,
        )}
      />
    </Link>
  );
}
