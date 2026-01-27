import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="text-sm text-zinc-600 mb-4 font-unbounded">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {!isLast ? (
                <>
                  <Link
                    to={item.path}
                    className="hover:text-blue-600 font-medium">
                    {item.label}
                  </Link>
                  <span className="mx-1 text-zinc-400">/</span>
                </>
              ) : (
                <span className="font-semibold text-zinc-900">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
