import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../db";
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query";

class Delivery {

  static connection = db.getConnection();

  // 배송리스트 조회(전체) : JOIN(order | product | delivery)
  static getDeliveries(currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const query = `
      SELECT 
        d.order_id, 
        uc.cor_corName,
        o.orderState,
        d.delivery_selectedCor,
        d.delivery_num, 
        DATE_FORMAT(o.order_date, '%Y-%m-%d') as order_date, 
        op.product_id, 
        p.product_title,
        op.selectedOption, 
        p.product_price, 
        op.order_cnt,
        ROUND((p.product_price * (1 - (p.product_discount * 0.01)))) as discountPrice 
      FROM delivery d
      JOIN \`order\` o 
        ON d.order_id = o.order_id
      JOIN order_product op 
        ON o.order_id = op.order_id
      JOIN product p 
       ON op.product_id = p.product_id
      JOIN users_corInfo uc
        ON uc.users_id = o.users_id
      WHERE o.orderState > 1 AND o.orderState < 5
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

    const mysql = require('mysql');
    const fullQuery = mysql.format(query, [offset, limit]);
    console.log(`
      fullQuery
      ${fullQuery}
    `);

    this.connection.query(countQuery, (err, countResult: any) => {
      if (err) {
        result(err, null);
        return;
      }
      const totalRows = countResult[0].totalRows
      this.connection.query(query, [offset, limit], (err: QueryError | null, res: RowDataPacket[]) => {
        if (err) {
          console.log("에러 발생: ", err);
          result(err, null);
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
        }
      });
    });
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


  /**
   * 배송관리 필터 컴포넌트에서 요청한 필터링된 정보를 반환합니다.
   * @param state Client에서 필터링 데이터로 체크된 배송 상태를 담습니다.
   * @param date Client에서 필터링 Range로 지정한 날짜를 담습니다.
   * @param result 
   */
  static filteredData(newFilter: any, currentPage: number, itemsPerPage: number, result: (error: any, data: any) => void) {
    const offset = (currentPage - 1) * itemsPerPage;
    const limit = itemsPerPage;

    // 조인 쿼리
    let joinedQuery = `
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
        op.order_cnt,
        ROUND((p.product_price * (1 - (p.product_discount * 0.01)))) as discountPrice 
      FROM 
       delivery d
      JOIN 
        \`order\` o ON d.order_id = o.order_id
      JOIN 
        order_product op ON o.order_id = op.order_id
      JOIN 
        product p ON op.product_id = p.product_id
      WHERE 1=1
    `; // : always true condition

    const stateCondition = newFilter.orderState && newFilter.orderState != '';
    const dateCondition = newFilter.startDate && newFilter.startDate != '' && newFilter.endDate && newFilter.endDate != '';
    /** 배송 상태 필터링 쿼리 */
    const stateFitlerQuery = stateCondition ? `AND orderState IN (?)` : ``;

    /** 날짜 필터링 쿼리 */
    const dateFilterQuery = dateCondition ? `AND o.order_date BETWEEN DATE_FORMAT(?, "%Y-%m-%d") AND DATE_FORMAT(?, "%Y-%m-%d")` : ``;

    /** ORDER BY: 정렬 */
    const orderBy = `ORDER BY o.order_date DESC, o.orderState DESC`;

    /** LIMIT: 페이징 */
    const paging = `LIMIT ${offset}, ${limit}`;

    /** 완성 쿼리 */
    const query = `
      ${joinedQuery} 
      ${stateFitlerQuery} 
      ${dateFilterQuery} 
      ${orderBy} 
      ${paging}
    `

    /** 쿼리 파라미터 */
    const queryParams: any = [];
    if (stateCondition)
      queryParams.push(newFilter.orderState);
    if (dateCondition) {
      queryParams.push(newFilter.startDate);
      queryParams.push(newFilter.endDate);
    }

    console.log(`쿼리 파라미터: ${queryParams}`);

    const mysql = require('mysql');
    // 쿼리와 파라미터를 합친 문자열 생성
    const fullQuery = mysql.format(query, queryParams);

    // 쿼리와 파라미터를 합친 문자열 출력
    console.log(`Full query: ${fullQuery}`);

    /** 전체 데이터 확인 */
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


    // 전체 데이터 크기 확인을 위한 쿼리
    this.connection.query(countQuery, (countErr, countResult: any) => {
      if (countErr) {
        result(countErr, null);
        this.connection.releaseConnection;
        return;
      }
      const totalRows = countResult[0].totalRows;

      this.connection.query(query, queryParams, (err: QueryError | Error | null, res: RowDataPacket[]) => {
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
          // 마지막 쿼리까지 모두 실행되면 결과를 반환합니다                                                                                                   .
          console.log("상품이 갱신되었습니다: ", responseData);
          result(null, responseData);
          this.connection.releaseConnection;
          return;
        }
      });
    });
  };
}

export default Delivery;
