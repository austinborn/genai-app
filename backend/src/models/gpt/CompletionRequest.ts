import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { Message } from "./Message"
import { dbClient } from "../../dbClient"
import { Job } from "../main/Job"

export class CompletionRequest extends CommonModel {
  public model!: string
  public temperature!: string
  public top_p!: string
  public completions!: string
  public max_tokens?: string
  public presence_penalty?: string
  public frequency_penalty?: string
  public job_uuid!: string
  public previous_message_uuid!: string
  public max_chat_history_length?: string
  public max_chat_history_chars?: string
}

CompletionRequest.init(
  {
    ...commonFields,
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    temperature: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    top_p: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    completions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    max_tokens: {
      type: DataTypes.INTEGER
    },
    presence_penalty: {
      type: DataTypes.NUMBER
    },
    frequency_penalty: {
      type: DataTypes.NUMBER
    },
    job_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Job, key: 'uuid' }
    },
    previous_message_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Message, key: 'uuid' }
    },
    max_chat_history_length: {
      type: DataTypes.INTEGER
    },
    max_chat_history_chars: {
      type: DataTypes.INTEGER
    }
  },
  {
    tableName: "completion_request",
    sequelize: dbClient,
    timestamps: false,
    schema: 'gpt'
  }
)
