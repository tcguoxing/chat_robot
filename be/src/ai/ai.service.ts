import { Injectable } from "@nestjs/common";
import AiOperator from "./weather/AiOperator";

@Injectable()
export class AiService {
  private aiOperator:any
  constructor() {
    this.aiOperator = new AiOperator()
  }
  getWeatherService(city): any {
    console.log('city: ', city)
    return this.aiOperator.getWeatherInfo(city)
  }
  searchInfo(info) {
    return this.aiOperator.searchInfo(info)
  }


  getAiService(): any {
  }
  
}
