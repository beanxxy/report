import axios from 'axios';
import { Message, MessageBox } from 'element-ui';
import { setItem, getItem, delItem } from '@/utils/storage';
import signUtil from '@/utils/signUtil';
import { deepClone } from "@/utils"

axios.defaults.baseURL = process.env.BASE_API
const service = axios.create({
  withCredentials: false,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  }
})

service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    var token = getItem('token');
    config.data = signUtil.sign(token, deepClone(config.data));
    // console.log(config, 'config')
    return config
  },
  error => {
    // Do something with request error
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.repCode == '0000') {
      return res
    }
    else if (res.repCode == '0024') {

      //登录超时或被登出，弹确认框，用户确认后，跳转到登录页面
      MessageBox({
        message: "当前登录已失效或异地登录，请重新登录",
        type: 'error',
        duration: 3 * 1000,
      }).then(() => {
        console.log(1)
        sessionStorage.clear();
        localStorage.clear();
        delItem('token')
        // location.reload();
        window.location.href = "/";
      }).catch(err => {
        console.log(2)
      })
    } else if (res.repCode == "3100" || res.repCode == "3101") {
      return res;
    }
    else {
      Message({
        message: res.repMsg,
        type: 'error',
        duration: 3 * 1000
      })
      return res;
    }
  },
  error => {
    var errorStatus = error.response.status;
    var errorData = error.response.data;
    var messageTxt = "";
    if (errorStatus != 200) {
      messageTxt = "服务器内部错误，请联系管理员";
    } else {
      messageTxt = '失败原因：' + errorData.repCode + '--' + errorData.repMsg;
    }
    Message({
      message: messageTxt,
      type: 'error',
      duration: 5 * 1000
    })
  }
)

export default service