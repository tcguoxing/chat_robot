import { createAgent, tool } from "langchain";
import * as z from "zod";
import dotenv from "dotenv";
import { searchTool } from "../searchTool";
import { log } from "console";
import a, {ChatAnthropic, AnthropicInput, ChatAnthropicInput, ChatAnthropicCallOptions, ChatAnthropicMessages} from '@langchain/anthropic'

dotenv.config();

    // const model = new ChatAnthropic({
    // })
    // model.temperature = 0.1
    // model.modelName = 'claude-sonnet-4-6'

export default class AiOperator {
  private agent: any

  constructor() {
    console.log('AiOperator')
    this.agent = null;
  }

  async init() {
    const getWeather = tool(
      (input) => ``,
      {
        name: "get_weather",
        description: "Get the weather for a given city", // zod好像很有用。
        schema: z.object({
          city: z.string().describe("The city to get the weather for"),
        }),
      }
    );

    this.agent = createAgent({
      model: "claude-sonnet-4-6",
      // model: "claude-3-7-sonnet-20250219",
      tools: [getWeather, searchTool],
      systemPrompt: `当用户查询天气时，使用searchTool查询天气后，再进行穿衣建议；当用户不再查询天气时，直接返回searchTool的结果`
    });
  }

  async getWeatherInfo(city = "北京") {
    if (!this.agent) await this.init();
    return this.agent.invoke({
      messages: [{ role: "user", content: `${city}天气怎么样啊?` }],
    });
  }
  async searchInfo(askResult="") {
    log('askResult: ', askResult)
    if (!this.agent) await this.init();
    return this.agent.invoke({
      messages: [{ role: "user", content: `${askResult}` }],
    });
  }
}
