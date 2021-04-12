import { useEffect, useState } from "react";
import Router from "next/router";
import StripeCheckout from "react-stripe-checkout";
import useRequest from "../../hooks/use-request";

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: "/api/payments",
    method: "post",
    body: {
      orderId: order.id,
    },
    onSuccess: () => Router.push("/orders"),
  });

  useEffect(
    () => {
      const findTimeLeft = () => {
        const msLeft = new Date(order.expiresAt) - new Date();
        setTimeLeft(Math.round(msLeft / 1000));
      };

      // Update time left immediately before setInterval fires
      findTimeLeft();
      const timerId = setInterval(findTimeLeft, 1000);

      // invoke clearInterval when we navigate away or when this
      // component is re-rendered
      return () => {
        clearInterval(timerId);
      };
    },
    // order dependency ensures clearInterval is called when component is re-rendered
    [order]
  );

  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      Time left to pay: {timeLeft} seconds
      {/* look at nextjs docs for how to set this stripeKey as an env with kubernetes */}
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51If4DQGmbPFPG9W4yo5Hz6rcHkUBxMfo6de7EoKu0LaX2IZAZZh3DGQyjTN22K3rTAflHopprHYn4ZjCWqRNkSHK00alpwtLAA"
        amount={order.ticket.price * 100}
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data };
};

export default OrderShow;
