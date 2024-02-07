import { Request, Response } from "express"
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import User from "../models/auth.model";
import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import shortid from "shortid";

const jwtSecret = 'sung_dong'

const authController = {
  // 로그인
  login: async (req: Request, res: Response) => {
    const loadUser = req.body;

    try {
      User.login(loadUser, (err: QueryError | Error | null, data: { users_id: number, userId: any, userPassword: any, userType_id: number } | null) => {
        if (err) {
          console.error(err);
          return res.status(400).send({ message: err.message || "아이디 및 비밀번호를 확인해주세요!" });
        }
        if (data !== null) {
          const token = jwt.sign({
            userType_id: data.userType_id,
            users_id: data.users_id
          }, jwtSecret, { expiresIn: '1h' });

          req.user = data;
          res.cookie('jwt_token', token, { secure: true, sameSite: "none" });
          res.status(200).json({ success: true, message: "로그인 되었습니다.", token });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "서버 오류 발생" });
    }
  },
  // 로그아웃
  logout: async (req: Request, res: Response) => {
    res.clearCookie('jwt_token', { secure: true, sameSite: 'none' });
    res.send({ success: true, message: "로그아웃 되었습니다." });
  },
  // 가입 조건 확인(내용 충족)
  register: async (req: Request, res: Response) => {
    if (!req.body) {
      res.status(400).send({
        message: "내용을 채워주세요!"
      });
    };
    const commonUserId = uuidv4();

    const newUser = {
      users1: {
        users_id: commonUserId,
        userType_id: req.body.userType_id,
        userId: req.body.userId,
        userPassword: req.body.userPassword,
      },
      users2: {
        users_id: commonUserId,
        userType_id: req.body.userType_id,
        email: req.body.email,
        emailService: req.body.emailService,
        name: req.body.name,
        tel: req.body.tel,
        smsService: req.body.smsService,
        hasCMS: req.body.hasCMS,
      },
      users3: {
        users_id: commonUserId,
        userType_id: req.body.userType_id,
        cor_ceoName: req.body.cor_ceoName,
        cor_corName: req.body.cor_corName,
        cor_sector: req.body.cor_sector,
        cor_category: req.body.cor_category,
        cor_num: req.body.cor_num,
        cor_fax: req.body.cor_fax,
        cor_tel: req.body.cor_tel
      },
      users4: {
        users_id: commonUserId,
        userType_id: req.body.userType_id,
        zonecode: req.body.zonecode,
        roadAddress: req.body.roadAddress,
        bname: req.body.bname,
        buildingName: req.body.buildingName,
        jibunAddress: req.body.jibunAddress,
        addressDetail: req.body.addressDetail
      },
      users5: {
        users_id: commonUserId,
        userType_id: req.body.userType_id,
      }
    };

    // 데이터베이스에 저장
    User.create(newUser, (err: { message: any; }) => {
      const code = req.cookies.register_code;
      if (err)
        return res.status(500).send({ message: err.message || "유저 정보를 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        User.removeCode(code, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
          if (err) {
            return res.status(500).send({ message: err });
          } else {
            res.clearCookie('register_code', { secure: true, sameSite: 'none' });
            return res.status(200).json({ message: '성공적으로 회원가입이 완료되었습니다.', success: true });
          }
        });
      }
    })
  },

  // 마이페이지
  info: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 사용 가능합니다." })
    }

    jwt.verify(token, jwtSecret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "재 로그인이 필요합니다." })
      }
      else {
        User.findAllUserInfo(user, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
          if (err) {
            return res.status(500).send({ message: err });
          } else {
            return res.status(200).json({ message: '인증이 완료되었습니다.', success: true, data });
          }
        });
      }
    })
  },
  /*---------------------------- 토큰 검증 -------------------------------*/

  user: async (req: Request, res: Response) => {
    const token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ message: "로그인 후 사용 가능합니다." })
    }


    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "재 로그인이 필요합니다." })
      }
      return res.status(200).json({ user: user })
    })
  },

  /*---------------------------- 유저 정보 조회 관련 ------------------------------*/
  isDuplicateById: async (req: Request, res: Response) => {
    const id = req.body.userId
    User.findByID(id, (err: QueryError | Error | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (result instanceof Error) {
        return res.status(409).json({ message: `${result.message}` });
      }

      return res.status(200).json({ message: '사용 가능한 아이디입니다.' });
    });
  },

  findId: async (req: Request, res: Response) => {
    if (!req.body) {
      res.status(400).send({
        message: "내용을 채워주세요!"
      });
    };
    const user = {
      cor_ceoName: req.body.cor_ceoName,
      cor_num: req.body.cor_num
    }
    User.findUserID(user, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        return res.status(200).json({ message: '아이디를 찾았습니다.', success: true, data });
      }
    });
  },
  findPw: async (req: Request, res: Response) => {
    if (!req.body) {
      res.status(400).send({
        message: "내용을 채워주세요!"
      });
    };
    const user = {
      userId: req.body.userId,
      cor_num: req.body.cor_num
    }
    User.findUserPw(user, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        return res.status(200).json({ message: '비밀번호를 찾았습니다.', success: true, data });
      }
    });
  },
  userAll: async (req: Request, res: Response) => {
    User.getAll((err: QueryError | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        return res.status(200).json({ message: '모든 유저를 조회하였습니다.', success: true, data });
      }
    });
  },
  userAllOfPage: async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.pagePosts as string, 10) || 10;

    User.getFindUserIfCondition(currentPage, itemsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "고객정보를 갱신하는 중 서버 오류가 발생했 습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 고객정보 갱신이 완료 되었습니다.', success: true, data });
      }
    })
  },
  userFilter: async (req: Request, res: Response) => {
    const filter = {
      cor_corName: req.body.cor_corName,
      cor_ceoName: req.body.cor_ceoName,
      cor_num: req.body.cor_num,
      userType_id: req.body.userType_id,
      grade: req.body.grade
    }
    User.filteredUser(filter, (err: QueryError | Error | null, data: RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      } else {
        return res.status(200).json({ message: '조건에 일치하는 유저를 조회합니다.', success: true, data });
      }
    });
  },
  userSort: async (req: Request, res: Response) => {
    const filter = {
      first: req.body.first,
      second: req.body.second,
      third: req.body.third
    }
    User.sortedUser(filter, (err: QueryError | Error | null, data: RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      } else {
        return res.status(200).json({ message: '조건에 맞게 정렬하였습니다.', success: true, data });
      }
    });
  },
  // 고객 정보 업데이트 컨트롤러
  userUpdate: async (req: Request, res: Response) => {
    const user = req.body;
    User.updateUser(user, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err.message || "고객 정보를 수정하는 중 서버 오류가 발생했습니다." });
      } else {
        return res.status(200).json({ message: "성공적으로 고객 정보가 수정되었습니다.", success: true, data })
      }
    })
  },

  // 유저 삭제 컨트롤러
  userDel: async (req: Request, res: Response) => {
    const usersId = req.params.ids.split(',').map(String);
    User.removeUser(usersId, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
      }
    })
  },


  /*----------------------------------코드 관련-------------------------------------*/
  getAllCode: async (req: Request, res: Response) => {
    User.getAllCode((err: QueryError | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        return res.status(200).json({ message: '모든 코드를 조회하였습니다.', success: true, data: data });
      }
    });
  },
  generateCode: async (req: Request, res: Response) => {
    const setCode = {
      user_code: shortid.generate()
    }
    User.generateCode(setCode, (err: QueryError | string | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        return res.status(200).json({ message: '코드를 생성하였습니다.', success: true, result });
      }
    });
  },
  checkCode: async (req: Request, res: Response) => {
    const code = req.body.user_code
    User.checkCode(code, (err: QueryError | Error | string | null, result: RowDataPacket | ResultSetHeader | RowDataPacket[] | null) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        if (result === null) {
          return res.status(400).json({ message: "일치하는 코드가 없습니다. 인증에 실패하였습니다.", success: false });
        } else {
          res.cookie('register_code', code, { secure: true, sameSite: "none" });
          return res.status(200).json({ message: '인증 되었습니다.', success: true, result });
        }
      }
    });
  },
}

export default authController