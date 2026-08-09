"use client";

import { BarChart3, Check, ChevronDown, Clock3, FileCheck2, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { useShopkeeper } from "../ShopkeeperContext";

export default function ShopkeeperDashboard() {
  const { queue, advanceOrder } = useShopkeeper();

  const getButtonDetails = (status: string, priority: string) => {
    if (priority === "Review") {
      return {
        className: "review",
        icon: <FileCheck2 size={15} />,
        label: "Review Rx"
      };
    } else if (status === "Confirmed") {
      return {
        className: "pack",
        icon: <Package size={15} />,
        label: "Pack Order"
      };
    } else if (status === "Packing") {
      return {
        className: "pack",
        icon: <Package size={15} />,
        label: "Ready to Ship"
      };
    } else {
      return {
        className: "pack",
        icon: <Clock3 size={15} />,
        label: "Deliver"
      };
    }
  };

  return (
    <section className="shop-content">
      <div className="shop-welcome">
        <div>
          <p>TODAY</p>
          <h1>Good morning, Dr. Ravi</h1>
          <h2>Here&apos;s what&apos;s happening at Care & Cure Pharmacy.</h2>
        </div>
        <div className="online"><i></i> Taking orders <ChevronDown size={14}/></div>
      </div>
      <div className="stat-grid">
        <div>
          <span className="stat-icon green"><ShoppingBag/></span>
          <p>Orders today</p>
          <b>24</b>
          <small>↑ 18% from yesterday</small>
        </div>
        <div>
          <span className="stat-icon orange"><Clock3/></span>
          <p>Awaiting action</p>
          <b>{queue.length}</b>
          <small>Need your attention</small>
        </div>
        <div>
          <span className="stat-icon purple"><Package/></span>
          <p>Avg. dispatch</p>
          <b>4 min</b>
          <small>↓ 1 min this week</small>
        </div>
        <div>
          <span className="stat-icon blue"><BarChart3/></span>
          <p>Today&apos;s sales</p>
          <b>₹8,640</b>
          <small>↑ 12% from yesterday</small>
        </div>
      </div>
      <div className="shop-grid">
        <section className="queue-card">
          <div className="panel-title">
            <div>
              <p>ORDER QUEUE</p>
              <h3>Needs your attention</h3>
            </div>
            <button onClick={() => location.href = "/shopkeeper/orders"}>View all orders</button>
          </div>
          {queue.length ? (
            <div className="queue-list">
              {queue.map(order => {
                const btn = getButtonDetails(order.status, order.priority);
                return (
                  <article key={order.id}>
                    <span className="customer-avatar">{order.initials}</span>
                    <div className="order-info">
                      <div>
                        <b>{order.name}</b>
                        <span>{order.time}</span>
                      </div>
                      <p>{order.items}</p>
                      <small><ShieldCheck size={12}/>{order.type} ({order.status})</small>
                    </div>
                    <button className={btn.className} onClick={() => advanceOrder(order.id)}>
                      {btn.icon} {btn.label}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="all-clear">
              <Check size={26}/>
              <b>All caught up</b>
              <p>Your order queue is clear.</p>
            </div>
          )}
        </section>
        <section className="performance-card">
          <div className="panel-title">
            <div>
              <p>TODAY&apos;S PERFORMANCE</p>
              <h3>Orders by hour</h3>
            </div>
            <button className="plain" onClick={() => location.href = "/shopkeeper/analytics"}>Today <ChevronDown size={12}/></button>
          </div>
          <div className="chart">
            <div className="bars">
              {[34,51,39,68,80,61,91,56,43,72,66,34].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} className={index === 6 ? "hot" : ""}></i>
              ))}
            </div>
            <div className="chart-labels">
              <span>9am</span>
              <span>12pm</span>
              <span>3pm</span>
              <span>6pm</span>
            </div>
          </div>
          <div className="performance-foot">
            <span><i></i> Orders received <b>24</b></span>
            <span>Peak: <b>3–4 PM</b></span>
          </div>
        </section>
      </div>
      <div className="inventory-alert">
        <span><Package size={20}/></span>
        <div>
          <b>2 items are running low</b>
          <p>Metformin 500mg and Azithromycin 500mg need restocking soon.</p>
        </div>
        <button onClick={() => location.href = "/shopkeeper/inventory"}>View inventory</button>
      </div>
    </section>
  );
}

