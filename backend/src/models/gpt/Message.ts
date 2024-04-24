import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { CompletionRequest } from "./CompletionRequest"
import { File } from "../main/File"
import { dbClient } from "../../dbClient"

export class Message extends CommonModel {
  public role!: 'user' | 'system' | 'assistant'
  public text_uuid!: string
  public completion_request_uuid?: string
  public previous_message_uuid?: string
  public completion_index!: string
}

Message.init(
  {
    ...commonFields,
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    text_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: File, key: 'uuid' }
    },
    completion_request_uuid: {
      type: DataTypes.UUID,
      references: { model: CompletionRequest, key: 'uuid' }
    },
    previous_message_uuid: {
      type: DataTypes.UUID,
      references: { model: Message, key: 'uuid' }
    },
    completion_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    tableName: "message",
    sequelize: dbClient,
    timestamps: false,
    schema: 'gpt'
  }
)
