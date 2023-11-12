import Link from "next/link";
import { withApollo } from "../lib/withApollo";

const Landing = () => {
  return (
    <h2>
      <Link href="/single-origin/">Single origin coffee</Link>
    </h2>
  );
};

export default withApollo(Landing);
