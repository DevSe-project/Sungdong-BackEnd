// 컨트롤러: 사용자의 입력을 처리하고 적절한 뷰를 렌더링하거나 업데이트
import { Request, Response } from "express";
import Delivery from "../models/delivery.model";

const deliveryController = {
  deliveryAll: (req: Request, res: Response) => {
    Delivery.getAllDeliveries((error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: error });
      }
      return res.status(200).json(results);
    });
  },
};

export default deliveryController;
