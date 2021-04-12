import { useEffect } from "react";
import Router from "next/router";
import useRequest from "../../hooks/use-request";

// We should only sign out a user from the browser and not from getInitialProps
// because we reset the user session on the server and clear any existing cookies.
// When that data is returned, only the browser will know how to handle the cookie data
// since we're not doing anything with it in getInitialProps
export default () => {
  const { doRequest } = useRequest({
    url: "/api/users/signout",
    method: "post",
    body: {},
    onSuccess: () => Router.push("/"),
  });

  useEffect(() => {
    doRequest();
  }, []);

  return <div>Signing you out...</div>;
};
