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
        src="/logo-dark.png"
        alt="HyperFix"
        className="h-[30px] w-auto translate-y-0.5 dark:hidden"
      />
      <img
        src="/logo-light.png"
        alt="HyperFix"
        className="hidden h-[30px] w-auto translate-y-0.5 dark:block"
      />
    </Link>
  );
}
