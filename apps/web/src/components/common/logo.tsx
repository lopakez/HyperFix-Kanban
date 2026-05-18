import { Link } from "@tanstack/react-router";
import useProjectStore from "@/store/project";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  const { setProject } = useProjectStore();

  return (
    <Link
      onClick={() => {
        setProject(undefined);
      }}
      to="/dashboard"
      className={`w-auto ${className}`}
    >
      <img
        src="/logo-dark.svg"
        alt="HyperFix"
        className="h-[150px] w-auto translate-y-1 dark:hidden"
      />
      <img
        src="/logo-light.svg"
        alt="HyperFix"
        className="hidden h-[150px] w-auto translate-y-1 dark:block"
      />
    </Link>
  );
}
