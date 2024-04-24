import { DataTypes } from "sequelize"
import { commonFields, CommonModel } from "../Common"
import { File } from "../main/File"
import { Batch } from "./Batch"
import { dbClient } from "../../dbClient"

export class GeneratedImage extends CommonModel {
  public seed!: string
  public batch_uuid!: string
  public generated_image_uuid?: string
  public has_nsfw?: boolean
  public tags?: string
  public batch_index!: string
}

GeneratedImage.init(
  {
    ...commonFields,
    seed: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    batch_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Batch, key: 'uuid' }
    },
    generated_image_uuid: {
      type: DataTypes.UUID,
      unique: true,
      references: { model: File, key: 'uuid' }
    },
    has_nsfw: {
      type: DataTypes.BOOLEAN
    },
    tags: {
      type: DataTypes.STRING
    },
    batch_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: "generated_image",
    sequelize: dbClient,
    timestamps: false,
    schema: 'sd'
  }
)
