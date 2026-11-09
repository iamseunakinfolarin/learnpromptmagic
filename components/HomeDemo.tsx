"use client";

import { useState } from "react";
import type { HomeDemo as HomeDemoContent } from "@/lib/content/schemas";
import Button from "./Button";
import Rail from "./Rail";
import Tag from "./Tag";
import Ticket from "./Ticket";

/**
 * The lunch demo: the same assistant answering a vague order and a clear one.
 * Both orders come from content/home-demo.json.
 */
export default function HomeDemo({ demo }: { demo: HomeDemoContent }) {
  const [detailed, setDetailed] = useState(false);
  const order = detailed ? demo.clear : demo.vague;

  return (
    <div className="demo">
      <Rail />
      <div className="demo-tickets">
        <Ticket head="Your order" aside="No. 001">
          {order.prompt}
        </Ticket>
        <Ticket head="From the kitchen" aside={<Tag>Sample</Tag>} live>
          {order.output}
        </Ticket>
      </div>
      <div className="demo-foot">
        <Button
          aria-pressed={detailed}
          onClick={() => setDetailed((on) => !on)}
        >
          {detailed ? "Take the details away" : "Add the details"}
        </Button>
        <p className="caption">Same assistant. Different order.</p>
      </div>
    </div>
  );
}
