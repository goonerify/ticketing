import axios from "axios";

export default ({ req }) => {
  if (typeof window === "undefined") {
    // We are on the server

    // Create a pre-configured version of axios client with a baseurl, domain, headers wired up
    return axios.create({
      baseURL: "http://istio-ingressgateway.istio-system.svc.cluster.local",
      headers: req.headers,
    });
  } else {
    // We must be on the
    // Create a pre-configured version of axios client
    return axios.create({
      baseUrl: "/",
    });
  }
};
