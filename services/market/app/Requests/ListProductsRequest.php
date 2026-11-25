<?php

namespace App\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ListProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],

            'cursor' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'search' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'min_price' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'max_price' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $minPrice = $this->input('min_price');
                $maxPrice = $this->input('max_price');

                if (
                    $minPrice !== null
                    && $maxPrice !== null
                    && is_numeric($minPrice)
                    && is_numeric($maxPrice)
                    && (int) $maxPrice < (int) $minPrice
                ) {
                    $validator->errors()->add(
                        'max_price',
                        'The maximum price must be greater than or equal to the minimum price.',
                    );
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('per_page')) {
            $this->merge([
                'per_page' => (int) $this->input('per_page'),
            ]);
        }
    }
}
