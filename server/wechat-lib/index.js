import axios from 'axios'
import { sign } from './util'
// https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
const API_BASE = 'https://api.weixin.qq.com/cgi-bin/'
const API = {
  GET_ACCESS_TOKEN: API_BASE + 'token?grant_type=client_credential',
  GET_TICKET: API_BASE + 'ticket/getticket?',
  MENU: {
    // https://api.weixin.qq.com/cgi-bin/menu/create?access_token=ACCESS_TOKEN
    CREATE: API_BASE + 'menu/create?',
    GET: API_BASE + 'menu/get?',
    DEL: API_BASE + 'menu/delete?',
    ADD_CONDITIONAL: API_BASE + 'menu/addconditional?',
    DEL_CONDITIONAL: API_BASE + 'menu/delconditional?',
    GET_INFO: API_BASE + 'get_current_selfmenu_info?'
  }
}
const ACCESS_TOKEN = 'access_token'
const TICKET = 'ticket'

export default class WeChat {
  constructor(options) {
    this.options = Object.assign({}, options)
    this.appID = options.appID
    this.appSecret = options.appSecret
    this.getAccessToken = options.getAccessToken
    this.saveAccessToken = options.saveAccessToken
    this.getTicket = options.getTicket
    this.saveTicket = options.saveTicket

    console.log('-----初始化fetchAccessToken--')
    this.fetchAccessToken()
    // this.fetchTicket()
    // this.updateAccessToken()
  }

  async request(options) {
    options = Object.assign({}, options, {json: true})
    try {
      const response = await axios(options)
      return response
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  async haddle(operation, ...args) {
    const token = await this.fetchAccessToken()
    // 拿到options
    // const options = this[operation].apply(this, [token.access_token, ...args])
    const options = this[operation](token.access_token, ...args)
    try {
      const {data} = await this.request(options)
      console.log('----------拿到handdle的数据-------------')
      console.log(data)
      return data
    } catch (error) {
      throw error
    }
  }
  async fetchAccessToken() {
    try {
      // 从缓存里面取AccessToken
      let token = await this.getAccessToken()
      // 校验AccessToken是否失效
      !this.isValidToken(token, ACCESS_TOKEN) && (token = await this.updateAccessToken())
      console.log('---fetchAccessToken 保存前-----')
      // 保存AccessToken
      await this.saveAccessToken(token)
      return token
    } catch (error) {
      throw error
    }
  }

  async updateAccessToken() {
    console.log('开始更新accesstoken')
    // 进行网络请求
    const url = API.GET_ACCESS_TOKEN + '&appid=' + this.appID + '&secret=' + this.appSecret
    let { data } = await axios.get(url)
    console.log(data)
    // TODO: 判断是否更新成功 => 有没有errcode字段
    const now = (new Date().getTime()) // 返回距离1970.1.1有多少毫秒
    const expiresIn = now + (data.expires_in - 20) * 1000 // data.expires_in单位为秒(7200 => 2小时) 需要将 秒 转为 毫秒( * 1000)
    data.expires_in = expiresIn
    return data
  }
  async fetchTicket(accessToken) {
    try {      
      // 从缓存里面取AccessToken
      let ticket = await this.getTicket()
      
      // 校验AccessToken是否失效
      !this.isValidToken(ticket, TICKET) && (ticket = await this.updateTicket(accessToken))
  
      // 保存Ticket
      await this.saveTicket(ticket)
  
      return ticket
    } catch (error) {
      throw error
    }
  }

  async updateTicket(accessToken) {
    console.log('开始更新ticket')
    // 进行网络请求
    const url = API.GET_TICKET + '&access_token=' + accessToken + '&type=jsapi'
    console.log('--------- ticket url ----' + url)
    try {
      let { data } = await axios.get(url)
      // TODO: 判断是否更新成功 => 有没有errcode字段
      const now = (new Date().getTime()) // 返回距离1970.1.1有多少毫秒
      const expiresIn = now + (data.expires_in - 20) * 1000 // data.expires_in单位为秒(7200 => 2小时) 需要将 秒 转为 毫秒( * 1000)
      data.expires_in = expiresIn
      return data
    } catch (error) {
      throw error
    }
  }

  isValidToken(token, type) {
    if (!token || !token[type] || !token.expires_in) {
      console.log('该' + type + '格式不合法')
      return false
    }
    console.log('------isValidToken-------')
    const expiresIn = token.expires_in
    const now = (new Date().getTime())
    // return now < expiresIn ? true : false
    if (now >= expiresIn) {
      console.log(type + '已过期')
      return false
    }
    console.log(type + '未过期')
    return true
  }

  sign(ticket, url) {
    return sign(ticket, url)
  }

  createMenu(token, menu) {
    const api = `${API.MENU.CREATE}access_token=${token}`
    const options = {
      method: 'post',
      url: api,
      data: menu
    }
    console.log('----------测试创建菜单-------------')
    console.log(options)
    return options
  }
  getMenu(token) {
    const api = `${API.MENU.GET}access_token=${token}`
    const options = {
      method: 'get',
      url: api
    }
    console.log('----------测试获取菜单-------------')
    console.log(options)
    return options
  }
  delMenu(token) {
    const api = `${API.MENU.DEL}access_token=${token}`
    const options = {
      method: 'get',
      url: api
    }
    console.log('----------测试删除菜单-------------')
    console.log(options)
    return options
  }
}