import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";

class Delivery {

  static connection = db.getConnection();

  // 배송리스트 조회(전체) : JOIN(order | product | delivery)
  static async getDeliveries(currentPage: number, itemsPerPage: number, result: (arg0: any, arg1: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const query = `
      SELECT 
        d.order_id, 
        o.orderState,
        d.delivery_selectedCor,
        d.delivery_num, 
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
      LIMIT ?, ?
      `;

    // 전체 데이터 크기 확인을 위한 쿼리
    const countQuery = `
      SELECT 
        COUNT(*) as totalRows 
      FROM 
        delivery d
      JOIN 
       \`order\` o ON d.order_id = o.order_id
      JOIN 
        order_product op ON o.order_id = op.order_id
      JOIN 
        product p ON op.product_id = p.product_id
    `;
    this.connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        this.connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows
      this.connection.query(query, [offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
          this.connection.releaseConnection;
          return;
        } else {
          const totalPages = Math.ceil(totalRows / itemsPerPage);
          const responseData = {
            data: res,
            currentPage: currentPage,
            totalPages: totalPages,
          }
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다.
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          this.connection.releaseConnection;
          return;
        }
      });
    })
  };



  // Update[Delivery State] - delivery_state 
  static async updateDeliveryState(orderId: string, newState: number) {
    try {
      const rows = await this.connection.execute(
        'UPDATE \`order\` SET orderState = ? WHERE order_id = ?',
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
