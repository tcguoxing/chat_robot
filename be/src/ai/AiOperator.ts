import { createAgent, tool } from "langchain";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();



export default class AiOperator {
  private agent: any
  constructor() {
    console.log('AiOperator')
    this.agent = null;
  }

  async init() {
    const getWeather = tool(
      (input) => `现在${input.city}是雨季!`,
      {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
          city: z.string().describe("The city to get the weather for"),
        }),
      }
    );
    this.agent = createAgent({
      model: "claude-sonnet-4-6",
      // model: "claude-3-7-sonnet-20250219",
      tools: [getWeather],
    });
  }

  async getWeatherInfo(city = "北京") {
    if (!this.agent) await this.init();
    return this.agent.invoke({
      messages: [{ role: "user", content: `${city}天气怎么样啊?` }],
    });
  }
}
