import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  last_page: number;

  items: T[];
}

///////////////////////////////////////////////////////////////////
// A helper function that returns a "concrete" version of PaginatedResponse
///////////////////////////////////////////////////////////////////
export const createPaginatedDto = <TModel extends new (...args: any[]) => any>(
  model: TModel,
) => {
  // We define a new class that extends PaginatedResponseDto<InstanceType<TModel>>
  // then use @ApiExtraModels to reference 'model' for proper reflection.
  class PaginatedResponseForModel extends PaginatedResponseDto<
    InstanceType<TModel>
  > {
    @ApiProperty({
      // We say "isArray: true" and type = model for the item type
      isArray: true,
      type: model,
      description: 'List of items of the given DTO',
    })
    items: InstanceType<TModel>[] = [];
  }

  // This is needed so Nest can pick up all metadata from the 'model' type
  // at runtime (like field definitions, etc.)
  @ApiExtraModels(model)
  class PaginatedResponseForModelWithExtra extends PaginatedResponseForModel {}

  return PaginatedResponseForModelWithExtra;
};
