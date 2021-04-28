import axios from "axios";

export default ({ req }) => {
  if (typeof window === "undefined") {
    // We are on the server

    console.log("Build client 1");
    try {
      // Create a pre-configured version of axios client with a baseurl, domain, headers wired up
      return axios.create({
        baseURL: "http://istio-ingressgateway.istio-system.svc.cluster.local",
        // baseURL: "http://40.88.54.78",
        headers: req.headers,
      });
    } catch (e) {
      console.log("Error 1");
      console.dir(err);
    }
  } else {
    console.log("Build client 2");
    // We must be on the
    // Create a pre-configured version of axios client
    try {
      return axios.create({
        baseUrl: "/",
      });
    } catch (e) {
      console.log("Error 2");
      console.dir(err);
    }
  }
};
