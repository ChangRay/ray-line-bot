// 引用linebot SDK
const linebot = require("linebot");
const axios = require("axios");

// 用於辨識Line Channel的資訊
const bot = linebot({
  channelId: "Id",
  channelSecret: "Secret",
  channelAccessToken:
    "Token"
});

// 當有人傳送訊息給Bot時
bot.on("message", function(event) {
  //   console.log(event);
  // 接收地址
  if (event.message.latitude) {
    axios
      .get(
        "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json"
      )
      .then(resJson => {
        // console.log(resJson.data.features);
        let target = [];
        let finished;
        let user_latitude = event.message.latitude;
        let user_longitude = event.message.longitude;
        console.log(
          `user_latitude:${user_latitude},  target_latitude:${resJson.data.features[0].geometry.coordinates[0]}`
        );
        console.log(
          `user_latitude:${user_latitude + 0.004},  target_latitude:${resJson
            .data.features[0].geometry.coordinates[0] - 0.004}`
        );
        console.log(
          user_latitude > resJson.data.features[0].geometry.coordinates[0]
        );
        console.log(resJson.data.features.length);
        // 過濾
        resJson.data.features.map(item => {
          let target_latitude = item.geometry.coordinates[1];
          let target_longitude = item.geometry.coordinates[0];
          //   ----------------
          if (
            target_latitude < user_latitude + 0.005 &&
            target_latitude > user_latitude - 0.005
          ) {
            if (
              target_longitude < user_longitude + 0.01 &&
              target_longitude > user_longitude - 0.01
            ) {
              target.push(item);
            }
          }
        });
        console.log(target.length);
        // 加工
        finished = target.map(item => {
          return {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: item.properties.name,
                  size: "xl",
                  weight: "bold",
                  color: "#333333"
                }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `成人口罩數量: ${item.properties.mask_adult}`,
                  size: "md",
                  weight: "bold",
                  color: item.properties.mask_adult > 50 ? "#1fa67a" : "#e91e1e"
                },
                {
                  type: "text",
                  text: `兒童口罩數量: ${item.properties.mask_child}`,
                  size: "md",
                  weight: "bold",
                  color: item.properties.mask_adult > 50 ? "#1fa67a" : "#e91e1e"
                },
                {
                  type: "separator"
                },
                {
                  type: "text",
                  text: `${
                    item.properties.note != "-" ? item.properties.note : ""
                  }\n\n建議先以電話跟藥局聯繋確認實際存量再前往購買。\n 我0K,你先領。`,
                  size: "sm",
                  wrap: true
                }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "Google地圖",
                    uri: `https://www.google.com.tw/maps/search/${item.geometry.coordinates[1]},${item.geometry.coordinates[0]}`
                  }
                },
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "聯絡電話",
                    uri: `tel:${item.properties.phone.replace(/\s-/, "")}`
                  }
                }
              ]
            }
          };
        });
        // console.log(finished);
        // 翻轉（由近到遠）
        finished.reverse();
        // if length > 0
        if (finished.length > 0) {
          event
            .reply({
              type: "flex",
              altText: "口罩即時庫存查詢",
              contents: {
                type: "carousel",
                contents: finished
              }
            })
            .then(function(data) {
              // 當訊息成功回傳後的處理
            })
            .catch(function(error) {
              // 當訊息回傳失敗後的處理
            });
        } else {
          // 找不到
          event
          // .reply(event.message.text)
          .reply("您附近沒有藥局，稍微換個地方試試吧～")
          .then(function(data) {
            // 當訊息成功回傳後的處理
          })
          .catch(function(error) {
            // 當訊息回傳失敗後的處理
          });
        }
      })
      .catch(error => console.log(error));
  } else {
    // event.message.text是使用者傳給bot的訊息
    // 使用event.reply(要回傳的訊息)方法可將訊息回傳給使用者
    event
      // .reply(event.message.text)
      .reply(
        `
    本帳號目前未提供1對1諮詢服務
    歡迎與我們電話或Email聯絡
    06-3138129
    service@renu.com.tw
    將由專人為您服務
    如有造成不便敬請見諒
    謝謝
    `
      )
      .then(function(data) {
        // 當訊息成功回傳後的處理
      })
      .catch(function(error) {
        // 當訊息回傳失敗後的處理
      });
  }
});

// Bot所監聽的webhook路徑與port
bot.listen("/linewebhook", process.env.PORT || 3000, function() {
  console.log(`BOT已準備就緒`);
});
