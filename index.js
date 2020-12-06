const request = require('request');
const log4js = require('log4js');
const cron = require("node-cron");
const fs = require("fs");
const dayjs = require('dayjs')
const dataPath = './data.txt';
const countPath = './count.txt';
const sundayCountPath = './sundayCount.text'
const { namePhoneMap } = require('./map.js')

const hookUrl = 'https://oapi.dingtalk.com/robot/send?access_token=0754a3f1adbb2fc6d6b7846e777dc1b830439561abc47ebaeec68d39fca287fd'

const logger = log4js.getLogger("DingdingBot");

// 获取拿饭人姓名
const getNames = () => {
  const nameData = fs.readFileSync(dataPath, {
    encoding: 'utf-8'
  })
  let count = fs.readFileSync(countPath, {
    encoding: 'utf-8'
  })
  let nameArr = nameData.split(',')
  const currentNames = nameArr.splice(0, 2).join()
  // 每个人一天需要拿两次
  if (count == 1) {
    nameArr.push(currentNames)
    fs.writeFileSync(dataPath, nameArr.join())
    fs.writeFileSync(countPath, '0')
  } else {
    fs.writeFileSync(countPath, ++count)
  }
  // 换好顺序的名字重新写入data.txt    
  return currentNames
}
// dingding
const fetchNotice = (msg = '', mobileArr) => {
  let options = {
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    },
    json: {
      "msgtype": "text",
      "text": {
        "content": msg
      },
      "at": {
        "atMobiles": mobileArr,
        "isAtAll": false
      }
    }
  };
  request.post(hookUrl, options, function (error, response, body) {
    logger.debug(`response: ${JSON.stringify(body)}`);
  });
}
// 获取拿饭人手机号
const getPhone = (nameString) => {
  const nameArr = nameString.split(',')
  const phoneArr = nameArr.reduce((arr, item)   => {
    arr.push(namePhoneMap[item])
    return arr
  }, [])
  return phoneArr
}

const timeToDo = (str) => {
  const currentName = getNames()
  const currentPhone = getPhone(currentName)
  fetchNotice(`${currentName} ${str}`, currentPhone)
}

const isWorkDay = () => {
  const weekDay = dayjs().day()
  if (weekDay === 6) return false
  if (weekDay === 0) {
    let sundayCount = fs.readFileSync(sundayCountPath, {
      encoding: 'utf-8'
    })
    let count = fs.readFileSync(countPath, {
      encoding: 'utf-8'
    })
    ++sundayCount
    if (count === 1) fs.writeFileSync(sundayCountPath, sundayCount)
    return sundayCount%2 === 0
  }
  return true
}


// 定时任务
cron.schedule(`00 00 12 * * *`, () => {
  console.log('少吃点,不饿就行了');
  if (isWorkDay()) timeToDo('差不多去拿午饭了')
});
cron.schedule(`10 00 18 * * *`, () => {
  console.log('注意,千万别吃饱');
  if(isWorkDay()) timeToDo('好去拿晚饭了')
});