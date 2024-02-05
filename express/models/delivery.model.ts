import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";

class Delivery {

  static connection = db.getConnection();

  // 배송리스트 조회(전체) : JOIN(order | product | delivery)
  static getAllDeliveries(result: (error: QueryError | null, results: RowDataPacket[] | ResultSetHeader | null) => void) {
    const query = `
            SELECT 
                d.order_id, 
                o.orderState,
                d.delivery_selectedCor,
                d.delivery_invoiceNumber, 
                DATE_FORMAT(o.order_date, '%Y-%m-%d') as order_date, 
                op.product_id, 
                p.product_title,
                op.selectedOption, 
                p.product_price, 
                ROUND((p.product_price * (1 - (p.product_discount * 0.01)))) as discountPrice 
            FROM 
                delivery d
            JOIN 
                \`order\` o ON d.order_id = o.order_id
            JOIN 
                order_product op ON o.order_id = op.order_id
            JOIN 
                product p ON op.product_id = p.product_id
        `;
    this.connection.query(query, (err: QueryError | null, res: RowDataPacket[] | ResultSetHeader | null) => {
      if (err) {
        console.log("에러 발생: ", err);
        result(err, null);
        return;
      } else {
        if (res) {
          console.log("찾은 유저: ", res);
          result(null, res); // 찾은 사용자 정보 반환
        } else {
          // 결과가 없을 시
          result(null, null);
        }
      }
    });
  }

  // Update[Delivery State] - delivery_state 
  static async updateDeliveryState(orderId: string, newState: number) {
    try {
      const rows = await this.connection.execute(
        'UPDATE delivery SET delivery_state = ? WHERE order_id = ?',
        [newState, orderId]
      );
      this.connection.releaseConnection;
      return rows;
    } catch (error: any) {
      throw new Error(`Failed to update delivery state: ${error.message}`);
    }
  }

  // Update[Delivery Invoice] - delivery_selectedCor, delivery_num 
  static async updateDeliveryInvoice(orderId: string, newSelectedCor: string, newNum: string) {
    try {
      const rows = await this.connection.execute(
        'UPDATE delivery SET delivery_selectedCor = ?, delivery_num = ? WHERE order_id = ?',
        [newSelectedCor, newNum, orderId]
      );
      this.connection.releaseConnection;
      return rows;
    } catch (error: any) {
      throw new Error(`Failed to update delivery state: ${error.message}`);
    }
  }

  static deleteByIds(orderIds: string[], result: (error: any, response: any) => void) {
    const deliveryQuery = "DELETE FROM delivery WHERE order_id IN (?)";
    const orderQuery = "DELETE FROM \`order\` WHERE order_id IN (?)";

    console.log("Delivery Query:", deliveryQuery);
    console.log("Order Query:", orderQuery);
    console.log("Order IDs:", orderIds);

    this.connection.query(deliveryQuery, [orderIds], (errDelivery, resDelivery) => {
      if (errDelivery) {
        console.log(`쿼리 실행 중 에러 발생 (delivery 테이블):`, errDelivery);
        result(errDelivery, null);
        this.connection.releaseConnection;
      } else {
        console.log('delivery 테이블에서 성공적으로 삭제 완료:', resDelivery);
        this.connection.query(orderQuery, [orderIds], (errOrder, resOrder) => {
          if (errOrder) {
            console.log(`쿼리 실행 중 에러 발생 (order 테이블):`, errOrder);
            result(errOrder, null);
            this.connection.releaseConnection;
          } else {
            console.log('order 테이블에서 성공적으로 삭제 완료:', resOrder);
            result(null, { delivery: resDelivery, order: resOrder });
            this.connection.releaseConnection;
          }
        });
      }
    });
  }

}

export default Delivery;
